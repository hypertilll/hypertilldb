PROJECT(hypertilldb-jsi C CXX)
cmake_minimum_required(VERSION 3.4.1)

# inspired by https://github.com/ericlewis/react-native-hostobject-demo/blob/6f16c01db80f928ccd294c8cc5d4668b0f8c15ec/android/app/CMakeLists.txt
# execute_process (COMMAND ln "-s" "src" "../../../../../node_modules/react-native/third-party/double-conversion-1.1.6/double-conversion")

# NOTE: This may need to be bumped sometimes to force CMake caches to clear
set(WMELON_JSI_BUMP 4)
set(SQLITE_VERSION sqlite-amalgamation-3460000)

# -------------------------------------------------
# Figure out where native dependencies live.
# Gradle now passes explicit package directories to make published/npm-installed builds work reliably.

if(DEFINED SQLITE_PACKAGE_PATH AND DEFINED SIMDJSON_PACKAGE_PATH AND DEFINED REACT_NATIVE_PACKAGE_PATH)
        set(SQLITE_BASE_PATH ${SQLITE_PACKAGE_PATH})
        set(SIMDJSON_BASE_PATH ${SIMDJSON_PACKAGE_PATH})
        set(REACT_NATIVE_BASE_PATH ${REACT_NATIVE_PACKAGE_PATH})
else()
        get_filename_component(_nativeTesterPath "../../../../../node_modules/@nozbe/sqlite/" REALPATH)
        get_filename_component(_workspaceReactPath "../../../../../../../../../native/node_modules/react-native/ReactCommon/jsi/jsi/" REALPATH)

        if(EXISTS "${_nativeTesterPath}")
                # these paths work for HypertillDB native tester
                set(NODE_MODULES_PATH_WM ../../../../../node_modules/)
                set(NODE_MODULES_PATH_RN ../../../../../node_modules/)
        elseif(EXISTS "${_workspaceReactPath}")
                # these paths work for the monorepo layout
                set(NODE_MODULES_PATH_WM ../../../../../../../)
                set(NODE_MODULES_PATH_RN ../../../../../../../../../native/node_modules/)
        else()
                # these paths should work for a standard RN project
                set(NODE_MODULES_PATH_WM ../../../../../../../)
                set(NODE_MODULES_PATH_RN ../../../../../../../)
        endif()

        set(SQLITE_BASE_PATH ${NODE_MODULES_PATH_WM}/@nozbe/sqlite)
        set(SIMDJSON_BASE_PATH ${NODE_MODULES_PATH_WM}/@nozbe/simdjson)
        set(REACT_NATIVE_BASE_PATH ${NODE_MODULES_PATH_RN}/react-native)
endif()

# -------------------------------------------------
# Header search paths
# FIXME: <simdjson/simdjson.h> should work…

include_directories(
        ../../../../shared
        ${SQLITE_BASE_PATH}/${SQLITE_VERSION}/
        ${SIMDJSON_BASE_PATH}/src/
        ${REACT_NATIVE_BASE_PATH}/React
        ${REACT_NATIVE_BASE_PATH}/React/Base
        ${REACT_NATIVE_BASE_PATH}/ReactCommon
        ${REACT_NATIVE_BASE_PATH}/ReactCommon/jsi
        # these seem necessary only if we import <jsi/JSIDynamic.h>
        #  ../../../../../node_modules/react-native/third-party/folly-2018.10.22.00
        #  ../../../../../node_modules/react-native/third-party/double-conversion-1.1.6
        #  ../../../../../node_modules/react-native/third-party/boost_1_63_0
        #  ../../../../../node_modules/react-native/third-party/glog-0.3.5/src
)

# -------------------------------------------------
# Build configuration

#add_definitions(
#        -DFOLLY_USE_LIBCPP=1
#        -DFOLLY_NO_CONFIG=1
#        -DFOLLY_HAVE_MEMRCHR=1
#)

# simdjson is slow without optimization
set(CMAKE_CXX_FLAGS_DEBUG "-Os") # comment out for JSI debugging
set(CMAKE_CXX_FLAGS_RELEASE "-Os")

# TODO: Configure sqlite with compile-time options
# https://www.sqlite.org/compile.html

# -------------------------------------------------
# Source files

file(GLOB ANDROID_JSI_SRC_FILES ./*.cpp)
file(GLOB SHARED_SRC_FILES ../../../../shared/*.cpp)

add_library(hypertilldb-jsi SHARED
        # vendor files
        ${SQLITE_BASE_PATH}/${SQLITE_VERSION}/sqlite3.c
        ${SIMDJSON_BASE_PATH}/src/simdjson.cpp
        # our sources
        ${ANDROID_JSI_SRC_FILES}
        ${SHARED_SRC_FILES}
        # this seems necessary to use almost any JSI API - otherwise we get linker errors
        # seems wrong to compile a file that's already getting compiled as part of the app, but ¯\_(ツ)_/¯
        ${REACT_NATIVE_BASE_PATH}/ReactCommon/jsi/jsi/jsi.cpp)

# Enable Android 16kb native library alignment
target_link_options(hypertilldb-jsi PRIVATE "-Wl,-z,max-page-size=16384")

target_link_libraries(hypertilldb-jsi
                      # link with these libraries:
                      android
                      log)
